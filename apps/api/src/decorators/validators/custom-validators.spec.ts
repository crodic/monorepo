import { validate } from 'class-validator';
import { IsBothOrNonePresent } from './is-both-or-none-present.decorator';
import { IsMs } from './is-ms.decorator';
import { IsNullable } from './is-nullable.decorator';
import { IsPassword } from './is-password.decorator';
import { IsPermissionsArray } from './is-permission-array.decorator';

class TestPasswordDto {
  @IsPassword()
  password!: string;
}

class TestMsDto {
  @IsMs()
  duration!: string;
}

class TestNullableDto {
  @IsNullable()
  field!: string | null;
}

class TestBothOrNoneDto {
  @IsBothOrNonePresent('fieldB')
  fieldA?: string;

  fieldB?: string;
}

class TestPermissionsDto {
  @IsPermissionsArray()
  permissions!: string[];
}

describe('Custom Validators', () => {
  describe('IsPassword', () => {
    it('should validate strong password', async () => {
      const dto = new TestPasswordDto();
      dto.password = 'StrongP@ssw0rd!';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail when password contains disallowed characters', async () => {
      const dto = new TestPasswordDto();
      dto.password = 'password with space';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('IsMs', () => {
    it('should pass for valid ms string', async () => {
      const dto = new TestMsDto();
      dto.duration = '10m';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail for invalid ms string', async () => {
      const dto = new TestMsDto();
      dto.duration = 'invalid-duration';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('IsNullable', () => {
    it('should allow null values', async () => {
      const dto = new TestNullableDto();
      dto.field = null;
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('IsBothOrNonePresent', () => {
    it('should pass when both fields are present', async () => {
      const dto = new TestBothOrNoneDto();
      dto.fieldA = 'valA';
      dto.fieldB = 'valB';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass when neither field is present', async () => {
      const dto = new TestBothOrNoneDto();
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail when only one field is present', async () => {
      const dto = new TestBothOrNoneDto();
      dto.fieldA = 'valA';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('IsPermissionsArray', () => {
    it('should pass for valid permissions', async () => {
      const dto = new TestPermissionsDto();
      dto.permissions = ['View users', 'Create users'];
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail for unknown permissions', async () => {
      const dto = new TestPermissionsDto();
      dto.permissions = ['NonExistentPermission'];
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
