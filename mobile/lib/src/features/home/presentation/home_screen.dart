import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/providers.dart';
import '../../../shared/utils/haptic_feedback.dart';
import '../../venues/domain/venue.dart';
import '../../bands/domain/band.dart';
import '../../../shared/widgets/venue_card.dart';
import '../../../shared/widgets/band_card.dart';
import '../../../shared/widgets/venue_card_skeleton.dart';
import '../../../shared/widgets/band_card_skeleton.dart';

// Providers for popular content
final popularVenuesProvider = FutureProvider.autoDispose<List<Venue>>((ref) async {
  final repository = ref.watch(venueRepositoryProvider);
  return repository.getPopularVenues(limit: 5);
});

final popularBandsProvider = FutureProvider.autoDispose<List<Band>>((ref) async {
  final repository = ref.watch(bandRepositoryProvider);
  return repository.getPopularBands(limit: 5);
});

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);
    final popularVenues = ref.watch(popularVenuesProvider);
    final popularBands = ref.watch(popularBandsProvider);

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          await HapticFeedbackUtil.mediumImpact();
          ref.invalidate(popularVenuesProvider);
          ref.invalidate(popularBandsProvider);
        },
        child: CustomScrollView(
          slivers: [
            // Modern Gradient Header
            SliverToBoxAdapter(
              child: Container(
                decoration: const BoxDecoration(
                  gradient: AppTheme.primaryGradient,
                ),
                child: SafeArea(
                  bottom: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(
                      AppTheme.spacing24,
                      AppTheme.spacing24,
                      AppTheme.spacing24,
                      AppTheme.spacing32,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Main Title
                        const Text(
                          'Discover',
                          style: TextStyle(
                            fontSize: 40,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            letterSpacing: -1.0,
                            height: 1.2,
                          ),
                        ),
                        const SizedBox(height: AppTheme.spacing8),

                        // Welcome Section
                        authState.when(
                          data: (user) => user != null
                              ? Text(
                                  'Welcome back, ${user.username}',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    color: Colors.white70,
                                    fontWeight: FontWeight.w500,
                                    letterSpacing: 0.2,
                                  ),
                                )
                              : const SizedBox.shrink(),
                          loading: () => const SizedBox.shrink(),
                          error: (_, __) => const SizedBox.shrink(),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // Content
            SliverPadding(
              padding: const EdgeInsets.all(AppTheme.spacing24),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // Premium Search Card
                  Semantics(
                    label: 'Search button for venues and bands',
                    button: true,
                    child: GestureDetector(
                      onTap: () async {
                        await HapticFeedbackUtil.lightImpact();
                        if (context.mounted) {
                          context.push('/search');
                        }
                      },
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: AppTheme.primaryGradient,
                          borderRadius: BorderRadius.circular(AppTheme.radiusLarge),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.primaryPurple.withOpacity(0.3),
                              blurRadius: 20,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppTheme.spacing20,
                          vertical: AppTheme.spacing20,
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(AppTheme.spacing8),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                              ),
                              child: const Icon(
                                Icons.search,
                                color: Colors.white,
                                size: 24,
                              ),
                            ),
                            const SizedBox(width: AppTheme.spacing16),
                            const Text(
                              'Search venues, bands...',
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.2,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: AppTheme.spacing32),

                  // Popular Venues Section
                  Row(
                    children: [
                      Container(
                        width: 4,
                        height: 28,
                        decoration: BoxDecoration(
                          gradient: AppTheme.primaryGradient,
                          borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                        ),
                      ),
                      const SizedBox(width: AppTheme.spacing12),
                      Expanded(
                        child: Text(
                          'Popular Venues',
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            letterSpacing: -0.5,
                          ),
                        ),
                      ),
                      Semantics(
                        label: 'See all venues button',
                        button: true,
                        child: TextButton(
                          onPressed: () async {
                            await HapticFeedbackUtil.lightImpact();
                            if (context.mounted) {
                              context.go('/venues');
                            }
                          },
                          child: const Text('See All'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppTheme.spacing16),

                  popularVenues.when(
                    data: (venues) => venues.isEmpty
                        ? Padding(
                            padding: const EdgeInsets.symmetric(vertical: AppTheme.spacing16),
                            child: Text(
                              'No popular venues at the moment',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppTheme.textSecondary,
                              ),
                            ),
                          )
                        : SizedBox(
                            height: 200,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount: venues.length,
                              itemBuilder: (context, index) {
                                return SizedBox(
                                  width: 300,
                                  child: VenueCard(
                                    venue: venues[index],
                                    onTap: () => context.push(
                                      '/venues/${venues[index].id}',
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                    loading: () => SizedBox(
                      height: 200,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: 3,
                        itemBuilder: (context, index) {
                          return const SizedBox(
                            width: 300,
                            child: VenueCardSkeleton(),
                          );
                        },
                      ),
                    ),
                    error: (error, stackTrace) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: AppTheme.spacing16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Could not load venues',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppTheme.error,
                            ),
                          ),
                          const SizedBox(height: AppTheme.spacing8),
                          Semantics(
                            label: 'Retry loading venues',
                            button: true,
                            child: TextButton.icon(
                              onPressed: () async {
                                await HapticFeedbackUtil.lightImpact();
                                ref.invalidate(popularVenuesProvider);
                              },
                              icon: const Icon(Icons.refresh),
                              label: const Text('Retry'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: AppTheme.spacing32),

                  // Popular Bands Section
                  Row(
                    children: [
                      Container(
                        width: 4,
                        height: 28,
                        decoration: BoxDecoration(
                          gradient: AppTheme.primaryGradient,
                          borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                        ),
                      ),
                      const SizedBox(width: AppTheme.spacing12),
                      Expanded(
                        child: Text(
                          'Popular Bands',
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            letterSpacing: -0.5,
                          ),
                        ),
                      ),
                      Semantics(
                        label: 'See all bands button',
                        button: true,
                        child: TextButton(
                          onPressed: () async {
                            await HapticFeedbackUtil.lightImpact();
                            if (context.mounted) {
                              context.go('/bands');
                            }
                          },
                          child: const Text('See All'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppTheme.spacing16),

                  popularBands.when(
                    data: (bands) => bands.isEmpty
                        ? Padding(
                            padding: const EdgeInsets.symmetric(vertical: AppTheme.spacing16),
                            child: Text(
                              'No popular bands at the moment',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppTheme.textSecondary,
                              ),
                            ),
                          )
                        : SizedBox(
                            height: 200,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount: bands.length,
                              itemBuilder: (context, index) {
                                return SizedBox(
                                  width: 300,
                                  child: BandCard(
                                    band: bands[index],
                                    onTap: () => context.push(
                                      '/bands/${bands[index].id}',
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                    loading: () => SizedBox(
                      height: 200,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: 3,
                        itemBuilder: (context, index) {
                          return const SizedBox(
                            width: 300,
                            child: BandCardSkeleton(),
                          );
                        },
                      ),
                    ),
                    error: (error, stackTrace) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: AppTheme.spacing16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Could not load bands',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppTheme.error,
                            ),
                          ),
                          const SizedBox(height: AppTheme.spacing8),
                          Semantics(
                            label: 'Retry loading bands',
                            button: true,
                            child: TextButton.icon(
                              onPressed: () async {
                                await HapticFeedbackUtil.lightImpact();
                                ref.invalidate(popularBandsProvider);
                              },
                              icon: const Icon(Icons.refresh),
                              label: const Text('Retry'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Bottom padding for breathing room
                  const SizedBox(height: AppTheme.spacing32),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
