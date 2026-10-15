import {
  StringField,
  TokenField,
} from '../../../../../decorators/field.decorators';

export class VerifyTwoFactorLoginReqDto {
  @TokenField()
  twoFactorToken!: string;

  @StringField({ example: '123456' })
  code!: string;
}
