import {
  BooleanField,
  StringField,
} from '../../../decorators/field.decorators';

export class VerifyAccountResDto {
  @BooleanField()
  verified!: boolean;

  @StringField()
  message!: string;

  @StringField()
  userId!: string;
}
