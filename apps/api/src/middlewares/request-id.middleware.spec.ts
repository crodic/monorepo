import { RequestIdMiddleware } from './request-id.middleware';

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
  });

  it('should generate a new request id if not provided in headers', () => {
    const req: any = { headers: {} };
    const res: any = { setHeader: jest.fn() };
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.requestId).toBeDefined();
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', req.requestId);
    expect(next).toHaveBeenCalled();
  });

  it('should reuse existing X-Request-Id from headers', () => {
    const existingId = 'custom-request-id-123';
    const req: any = { headers: { 'x-request-id': existingId } };
    const res: any = { setHeader: jest.fn() };
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.requestId).toBe(existingId);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', existingId);
    expect(next).toHaveBeenCalled();
  });
});
