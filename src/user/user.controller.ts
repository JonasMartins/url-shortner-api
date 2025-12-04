import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CreateUserDTO } from './dto/user.dto';
import { UserService } from './user.service';

@ApiTags('Usuários')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @ApiOperation({ summary: 'Cria um novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'Retorna o usuário criado',
  })
  @ApiBody({ type: CreateUserDTO })
  @Post()
  async create(@Body() data: CreateUserDTO) {
    return this.userService.createUser(data);
  }
}
