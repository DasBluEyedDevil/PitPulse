import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_config.dart';

/// DioClient provides a configured Dio instance with interceptors
class DioClient {
  final Dio _dio;
  final FlutterSecureStorage _secureStorage;

  DioClient({
    required FlutterSecureStorage secureStorage,
  })  : _secureStorage = secureStorage,
        _dio = Dio(
          BaseOptions(
            baseUrl: ApiConfig.baseUrl,
            connectTimeout: ApiConfig.connectTimeout,
            receiveTimeout: ApiConfig.receiveTimeout,
            sendTimeout: ApiConfig.sendTimeout,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          ),
        ) {
    _initializeInterceptors();
  }

  void _initializeInterceptors() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Add JWT token to headers for authenticated requests
          final token = await _secureStorage.read(key: ApiConfig.tokenKey);
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          // Handle 401 Unauthorized errors
          if (error.response?.statusCode == 401) {
            // Token expired or invalid - clear storage
            await _secureStorage.delete(key: ApiConfig.tokenKey);
            await _secureStorage.delete(key: ApiConfig.userKey);
          }
          return handler.next(error);
        },
      ),
    );

    // Add logging interceptor ONLY in development mode
    if (ApiConfig.isDev) {
      _dio.interceptors.add(
        LogInterceptor(
          requestBody: true,
          responseBody: true,
          error: true,
          logPrint: print,
        ),
      );
    }
  }

  /// GET request with error classification
  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.get(
        path,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// POST request with error classification
  Future<Response> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.post(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// PUT request with error classification
  Future<Response> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.put(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// DELETE request with error classification
  Future<Response> delete(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.delete(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// PATCH request with error classification
  Future<Response> patch(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.patch(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// Handle DioException and convert to user-friendly messages
  Exception _handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return Exception('Connection timeout. Please check your internet connection and try again.');

      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final message = error.response?.data?['error'] ?? 'Request failed';

        if (statusCode == 400) {
          return Exception('Invalid request: $message');
        } else if (statusCode == 401) {
          return Exception('Authentication required. Please log in again.');
        } else if (statusCode == 403) {
          return Exception('Access denied: $message');
        } else if (statusCode == 404) {
          return Exception('Resource not found: $message');
        } else if (statusCode == 422) {
          return Exception('Validation error: $message');
        } else if (statusCode != null && statusCode >= 500) {
          return Exception('Server error. Please try again later.');
        }
        return Exception(message);

      case DioExceptionType.cancel:
        return Exception('Request was cancelled');

      case DioExceptionType.connectionError:
        return Exception('No internet connection. Please check your network settings.');

      case DioExceptionType.badCertificate:
        return Exception('Security certificate error. Please check your connection.');

      case DioExceptionType.unknown:
      default:
        if (error.message?.contains('SocketException') ?? false) {
          return Exception('No internet connection. Please check your network settings.');
        }
        return Exception('An unexpected error occurred. Please try again.');
    }
  }
}
