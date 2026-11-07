import { Application } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import logger from './logger';
import { ProxyErrorResponse, ServiceConfig } from '../types';
import config from '.';

class ServiceProxy {
  private static readonly serviceConfigs: ServiceConfig[] = [
    {
      path: '/api/auth',
      url: config.services.user,
      name: 'auth-service',
      timeout: 5000,
    },
    {
      path: '/api/users',
      url: config.services.user,
      name: 'user-service',
      timeout: 5000,
    },
    {
      path: '/api/tasks',
      url: config.services.task,
      name: 'task-service',
      timeout: 5000,
    },
    {
      path: '/api/notifications',
      url: config.services.notification,
      name: 'notification-service',
      timeout: 5000,
    },
  ];

  private static createProxyOptions(service: ServiceConfig): Options {
    return {
      target: service.url,
      changeOrigin: true,
      // Express strips the mount path from req.url, so forward the full original path.
      pathRewrite: (_path: string, req: any) => req.originalUrl as string,
      timeout: service.timeout || config.DEFAULT_TIMEOUT,
      logger: logger,
      on: {
        error: ServiceProxy.handleProxyError,
        proxyReq: ServiceProxy.handleProxyRequest,
        proxyRes: ServiceProxy.handleProxyResponse,
      },
    };
  }

  private static handleProxyError(err: Error, req: any, res: any): void {
    logger.error(`Proxy error for ${req.path}:`, err);

    const errorResponse: ProxyErrorResponse = {
      message: 'Service unavailable',
      status: 503,
      timestamp: new Date().toISOString(),
    };

    res
      .status(503)
      .setHeader('Content-Type', 'application/json')
      .end(JSON.stringify(errorResponse));
  }

  private static handleProxyRequest(proxyReq: any, req: any): void {
    // logger.debug(`Proxying request to ${req.path}`);
  }

  private static handleProxyResponse(proxyRes: any, req: any): void {
    // logger.debug(`Received response for ${req.path}`);
  }

  public static setupProxy(app: Application): void {
    ServiceProxy.serviceConfigs.forEach((service) => {
      const proxyOptions = ServiceProxy.createProxyOptions(service);
      app.use(service.path, createProxyMiddleware(proxyOptions));
      logger.info(`Configured proxy for ${service.name} at ${service.path}`);
    });
  }
}

export const proxyServices = (app: Application): void => {
  ServiceProxy.setupProxy(app);
};

/**
 * Proxies Socket.IO (HTTP polling + WebSocket upgrade) to the
 * notification-service, which hosts the realtime hub. Mounted with a
 * `pathFilter` so only `/socket.io/*` traffic is routed, while the full
 * original path is preserved for the upstream hub.
 */
export const setupRealtimeProxy = (app: Application): void => {
  app.use(
    createProxyMiddleware({
      pathFilter: '/socket.io',
      target: config.services.notification,
      changeOrigin: true,
      ws: true,
      logger,
    })
  );
  logger.info(
    `Configured WebSocket proxy for notification-service at /socket.io`
  );
};
