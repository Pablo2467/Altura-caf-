import { Controller, Get } from "@nestjs/common";
import { MenuService } from "./menu.service.js";

@Controller('public')
export class MenuController {
    constructor(private menu: MenuService) {}

    @Get('branches')
    branches() {
        return this.menu.getBranches();
    }

    @Get('menu')
    getmenu() {
        return this.menu.getMenu();
    }
}