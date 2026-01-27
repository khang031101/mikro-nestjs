import { AuthService } from '@/modules/auth/auth.service';
import { UserHelper } from './user.helper';

export class AuthHelper {
  private userHelper: UserHelper;
  private authService: AuthService;

  constructor() {
    this.userHelper = new UserHelper();
    this.authService = global.testContext.app.get(AuthService);
  }

  async getAuthHeader(
    email: string,
    password = 'Test@1234',
  ): Promise<{ cookie: string }> {
    const user = await this.userHelper.createUser(email, password);

    const { accessToken } = await this.authService.generateTokens(user);
    return {
      cookie: `access_token=${accessToken}`,
    };
  }
}
