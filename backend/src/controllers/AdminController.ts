import { Request, Response } from 'express';
import { ApiResponse } from '../types';
import Database from '../config/database';
import { cache, CacheKeys } from '../utils/cache';
import { getWebSocketStats } from '../utils/websocket';
import logger, { logInfo, logWarn } from '../utils/logger';

/**
 * Admin Controller - Dashboard and management utilities
 *
 * SECURITY: All routes should be protected with admin middleware
 * Example: router.get('/admin/stats', requireAdmin, AdminController.getStats);
 */
export class AdminController {
  /**
   * Get system statistics
   * GET /api/admin/stats
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const db = Database.getInstance();

      // Get database stats
      const [userCount] = await db.query('SELECT COUNT(*) as count FROM users');
      const [venueCount] = await db.query('SELECT COUNT(*) as count FROM venues');
      const [bandCount] = await db.query('SELECT COUNT(*) as count FROM bands');
      const [reviewCount] = await db.query('SELECT COUNT(*) as count FROM reviews');
      const [checkinCount] = await db.query('SELECT COUNT(*) as count FROM checkins');

      // Get recent activity (last 24 hours)
      const [recentUsers] = await db.query(
        'SELECT COUNT(*) as count FROM users WHERE created_at > NOW() - INTERVAL 24 HOUR'
      );
      const [recentReviews] = await db.query(
        'SELECT COUNT(*) as count FROM reviews WHERE created_at > NOW() - INTERVAL 24 HOUR'
      );
      const [recentCheckins] = await db.query(
        'SELECT COUNT(*) as count FROM checkins WHERE created_at > NOW() - INTERVAL 24 HOUR'
      );

      // Get cache stats
      const cacheStats = cache.getStats();

      // Get WebSocket stats
      const wsStats = getWebSocketStats();

      const response: ApiResponse = {
        success: true,
        data: {
          counts: {
            users: userCount[0].count,
            venues: venueCount[0].count,
            bands: bandCount[0].count,
            reviews: reviewCount[0].count,
            checkins: checkinCount[0].count,
          },
          recent24h: {
            newUsers: recentUsers[0].count,
            newReviews: recentReviews[0].count,
            newCheckins: recentCheckins[0].count,
          },
          cache: cacheStats,
          websocket: wsStats,
          timestamp: new Date().toISOString(),
        },
      };

      logInfo('Admin stats accessed');
      res.status(200).json(response);
    } catch (error) {
      logger.error('Error getting admin stats:', error);

      const response: ApiResponse = {
        success: false,
        error: 'Failed to get system stats',
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get top venues by rating
   * GET /api/admin/top-venues?limit=10
   */
  async getTopVenues(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const db = Database.getInstance();

      const [venues] = await db.query(
        `
        SELECT
          v.id,
          v.name,
          v.city,
          v.state,
          AVG(r.rating) as average_rating,
          COUNT(r.id) as review_count
        FROM venues v
        LEFT JOIN reviews r ON v.id = r.venue_id
        WHERE v.is_active = true
        GROUP BY v.id
        HAVING review_count > 0
        ORDER BY average_rating DESC, review_count DESC
        LIMIT ?
        `,
        [limit]
      );

      const response: ApiResponse = {
        success: true,
        data: venues,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error getting top venues:', error);

      const response: ApiResponse = {
        success: false,
        error: 'Failed to get top venues',
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get user activity report
   * GET /api/admin/user-activity?userId=123
   */
  async getUserActivity(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.query.userId as string;

      if (!userId) {
        const response: ApiResponse = {
          success: false,
          error: 'userId is required',
        };
        res.status(400).json(response);
        return;
      }

      const db = Database.getInstance();

      // Get user info
      const [users] = await db.query('SELECT id, username, email, created_at FROM users WHERE id = ?', [userId]);

      if (!users || users.length === 0) {
        const response: ApiResponse = {
          success: false,
          error: 'User not found',
        };
        res.status(404).json(response);
        return;
      }

      // Get user's activity counts
      const [reviewCount] = await db.query('SELECT COUNT(*) as count FROM reviews WHERE user_id = ?', [userId]);
      const [checkinCount] = await db.query('SELECT COUNT(*) as count FROM checkins WHERE user_id = ?', [userId]);
      const [followerCount] = await db.query('SELECT COUNT(*) as count FROM user_followers WHERE following_id = ?', [userId]);
      const [followingCount] = await db.query('SELECT COUNT(*) as count FROM user_followers WHERE follower_id = ?', [userId]);

      // Get recent reviews
      const [recentReviews] = await db.query(
        `
        SELECT r.*, v.name as venue_name, b.name as band_name
        FROM reviews r
        LEFT JOIN venues v ON r.venue_id = v.id
        LEFT JOIN bands b ON r.band_id = b.id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
        LIMIT 10
        `,
        [userId]
      );

      const response: ApiResponse = {
        success: true,
        data: {
          user: users[0],
          activity: {
            reviewCount: reviewCount[0].count,
            checkinCount: checkinCount[0].count,
            followerCount: followerCount[0].count,
            followingCount: followingCount[0].count,
          },
          recentReviews,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error getting user activity:', error);

      const response: ApiResponse = {
        success: false,
        error: 'Failed to get user activity',
      };

      res.status(500).json(response);
    }
  }

  /**
   * Clear cache
   * POST /api/admin/cache/clear
   */
  async clearCache(req: Request, res: Response): Promise<void> {
    try {
      const pattern = req.body.pattern as string | undefined;

      if (pattern) {
        await cache.delPattern(pattern);
        logInfo(`Admin cleared cache pattern: ${pattern}`);
      } else {
        await cache.clear();
        logInfo('Admin cleared all cache');
      }

      const response: ApiResponse = {
        success: true,
        data: {
          message: pattern ? `Cache cleared for pattern: ${pattern}` : 'All cache cleared',
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error clearing cache:', error);

      const response: ApiResponse = {
        success: false,
        error: 'Failed to clear cache',
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get database health check
   * GET /api/admin/health/database
   */
  async getDatabaseHealth(req: Request, res: Response): Promise<void> {
    try {
      const db = Database.getInstance();
      const isHealthy = await db.healthCheck();

      const response: ApiResponse = {
        success: true,
        data: {
          healthy: isHealthy,
          timestamp: new Date().toISOString(),
        },
      };

      res.status(isHealthy ? 200 : 503).json(response);
    } catch (error) {
      logger.error('Error checking database health:', error);

      const response: ApiResponse = {
        success: false,
        error: 'Failed to check database health',
      };

      res.status(500).json(response);
    }
  }

  /**
   * Moderate content (delete review, ban user, etc.)
   * POST /api/admin/moderate
   */
  async moderateContent(req: Request, res: Response): Promise<void> {
    try {
      const { action, targetType, targetId, reason } = req.body;

      if (!action || !targetType || !targetId) {
        const response: ApiResponse = {
          success: false,
          error: 'action, targetType, and targetId are required',
        };
        res.status(400).json(response);
        return;
      }

      const db = Database.getInstance();

      switch (action) {
        case 'delete_review':
          await db.query('DELETE FROM reviews WHERE id = ?', [targetId]);
          logWarn(`Admin deleted review: ${targetId}. Reason: ${reason || 'Not specified'}`);
          break;

        case 'ban_user':
          await db.query('UPDATE users SET is_active = false WHERE id = ?', [targetId]);
          logWarn(`Admin banned user: ${targetId}. Reason: ${reason || 'Not specified'}`);
          break;

        case 'delete_venue':
          await db.query('UPDATE venues SET is_active = false WHERE id = ?', [targetId]);
          logWarn(`Admin deleted venue: ${targetId}. Reason: ${reason || 'Not specified'}`);
          break;

        default:
          const response: ApiResponse = {
            success: false,
            error: 'Invalid action',
          };
          res.status(400).json(response);
          return;
      }

      const response: ApiResponse = {
        success: true,
        data: {
          message: `${action} completed successfully`,
          action,
          targetType,
          targetId,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error moderating content:', error);

      const response: ApiResponse = {
        success: false,
        error: 'Failed to moderate content',
      };

      res.status(500).json(response);
    }
  }
}

export default new AdminController();
