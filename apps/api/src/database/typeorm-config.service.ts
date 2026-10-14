import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from './naming-strategies/snake-naming.strategy';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isSslEnabled = this.configService.get<boolean>(
      'database.sslEnabled',
      false,
    );

    return {
      type: 'postgres',
      host: this.configService.get<string>('database.host', 'localhost'),
      port: this.configService.get<number>('database.port', 5432),
      username: this.configService.get<string>('database.username', 'postgres'),
      password: this.configService.get<string>('database.password', 'postgres'),
      database: this.configService.get<string>('database.name', 'monorepo'),
      synchronize: this.configService.get<boolean>(
        'database.synchronize',
        false,
      ),
      dropSchema: false,
      logging: this.configService.get<string>('app.nodeEnv') !== 'production',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
      namingStrategy: new SnakeNamingStrategy(),
      extra: {
        max: this.configService.get<number>('database.maxConnections', 100),
        ssl: isSslEnabled
          ? {
              rejectUnauthorized: this.configService.get<boolean>(
                'database.rejectUnauthorized',
                false,
              ),
              ca: this.configService.get<string>('database.ca') || undefined,
              key: this.configService.get<string>('database.key') || undefined,
              cert:
                this.configService.get<string>('database.cert') || undefined,
            }
          : undefined,
      },
    };
  }
}
