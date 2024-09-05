import { IsOptional, IsString } from "class-validator";

export class createBookmarkDto{
  @IsString()
  title:string;

  @IsString()
  @IsOptional()
  description?:string;

  @IsString()
  link:string;
}