import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  BooleanField,
  BooleanFieldOptional,
  DateField,
  EnumField,
  NumberField,
  NumberFieldOptional,
  StringField,
  StringFieldOptional,
  UUIDField,
} from './field.decorators';

enum TestStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

class TestFieldDto {
  @StringField({ minLength: 3 })
  name!: string;

  @StringFieldOptional()
  description?: string;

  @NumberField({ min: 10, int: true })
  age!: number;

  @NumberFieldOptional()
  score?: number;

  @BooleanField()
  isActive!: boolean;

  @BooleanFieldOptional()
  isVerified?: boolean;

  @EnumField(() => TestStatus)
  status!: TestStatus;

  @DateField()
  createdAt!: Date;

  @UUIDField()
  id!: string;
}

describe('Field Decorators', () => {
  it('should validate valid payload', async () => {
    const raw = {
      name: 'John Doe',
      age: '25',
      isActive: 'true',
      status: TestStatus.ACTIVE,
      createdAt: '2026-01-01T00:00:00.000Z',
      id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    };

    const instance = plainToInstance(TestFieldDto, raw);
    expect(instance.age).toBe(25);
    expect(instance.isActive).toBe(true);
    expect(instance.createdAt).toBeInstanceOf(Date);

    const errors = await validate(instance);
    expect(errors.length).toBe(0);
  });

  it('should fail when number constraints are violated', async () => {
    const raw = {
      name: 'John',
      age: 5, // min is 10
      isActive: true,
      status: TestStatus.ACTIVE,
      createdAt: new Date(),
      id: '123e4567-e89b-12d3-a456-426614174000',
    };

    const instance = plainToInstance(TestFieldDto, raw);
    const errors = await validate(instance);
    const ageError = errors.find((e) => e.property === 'age');
    expect(ageError).toBeDefined();
  });

  it('should fail when UUID format is invalid', async () => {
    const raw = {
      name: 'John',
      age: 20,
      isActive: true,
      status: TestStatus.ACTIVE,
      createdAt: new Date(),
      id: 'not-a-valid-uuid',
    };

    const instance = plainToInstance(TestFieldDto, raw);
    const errors = await validate(instance);
    const idError = errors.find((e) => e.property === 'id');
    expect(idError).toBeDefined();
  });
});
