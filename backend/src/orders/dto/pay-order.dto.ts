import { PaymentMethod } from "@prisma/client";
import { IsEnum } from "class-validator";

export class PayOrderDto {
    @IsEnum(PaymentMethod)
    method: PaymentMethod;
}