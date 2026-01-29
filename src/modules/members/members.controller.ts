import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Permission } from '@/common/enums/permission.enum';
import { CreateMemberDto, QueryMemberDto, UpdateMemberDto } from './dtos';
import { MembersService } from './members.service';

@Controller('members')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @RequirePermissions(Permission.ADMIN)
  async create(@Body() dto: CreateMemberDto) {
    return this.membersService.create(dto);
  }

  @Get()
  @RequirePermissions(Permission.USER_READ)
  async findPaged(@Query() query: QueryMemberDto) {
    return this.membersService.findPaged(query);
  }

  @Get(':id')
  @RequirePermissions(Permission.USER_READ)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.membersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.membersService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.membersService.remove(id);
    return { message: 'Member removed successfully' };
  }
}
