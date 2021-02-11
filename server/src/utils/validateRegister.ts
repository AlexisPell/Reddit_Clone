import { UsernamePasswordInput } from './../resolvers/UsernamePasswordInput';

export const validateRegister = (options: UsernamePasswordInput) => {
  if (!options.email.includes('@')) {
    return [{ field: 'email', message: 'invalid email' }];
  }

  if (options.username.length <= 2) {
    return [{ field: 'username', message: 'username is too short. 3 chars at least' }];
  }

  if (options.username.includes('@')) {
    return [{ field: 'username', message: 'cannot include an @' }];
  }

  if (options.password.length < 6) {
    return [{ field: 'password', message: 'password is too short. 6 chars at least' }];
  }
  return null;
};
