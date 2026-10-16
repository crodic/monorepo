import 'reflect-metadata';
import { getOrder, Order } from './order.decorator';

describe('Order Decorator', () => {
  class TestEntity {
    @Order(1)
    id: number;

    @Order(2)
    name: string;

    unannotated: string;
  }

  it('should retrieve defined order values for decorated properties', () => {
    const instance = new TestEntity();
    expect(getOrder(instance, 'id')).toBe(1);
    expect(getOrder(instance, 'name')).toBe(2);
  });

  it('should return default value for unannotated properties', () => {
    const instance = new TestEntity();
    expect(getOrder(instance, 'unannotated')).toBe(0);
    expect(getOrder(instance, 'unannotated', 99)).toBe(99);
  });

  it('should return default value for non-object targets', () => {
    expect(getOrder(null, 'id', 5)).toBe(5);
    expect(getOrder(undefined, 'id', 5)).toBe(5);
    expect(getOrder('not an object', 'id', 5)).toBe(5);
    expect(getOrder(123, 'id', 5)).toBe(5);
  });
});
