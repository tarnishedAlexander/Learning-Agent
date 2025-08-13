import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class CreatePermissionDto {
  @IsString() @IsNotEmpty() action!: string;
  @IsString() @IsNotEmpty() resource!: string;
  @IsOptional() @IsString() description?: string | null;
}
