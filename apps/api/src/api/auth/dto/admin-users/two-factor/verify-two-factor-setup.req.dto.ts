import { StringField } from '../../../../../decorators/field.decorators';

export class VerifyTwoFactorSetupReqDto {
  @StringField({ example: '123456' })
  code!: string;
}
