import { Box, Button, Flex, Link } from '@chakra-ui/react';

import NextLink from 'next/link';
import { isServer } from '../utils/isServer';

import { useLogoutMutation, useMeQuery } from './../generated/graphql';

interface NavBarProps {}

const NavBar: React.FC<NavBarProps> = ({}) => {
  const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
  const [{ data, fetching }] = useMeQuery({
    pause: isServer(),
  });
  let body = null;

  console.log('data:', data);

  // User info loading
  if (fetching) {
    body = null;
  }
  // User is not logged in
  else if (!data?.me) {
    body = (
      <>
        <NextLink href='/login'>
          <Link mr={2}>Login</Link>
        </NextLink>
        <NextLink href='register'>
          <Link>Register</Link>
        </NextLink>
      </>
    );
  }
  // User is logged in
  else {
    body = (
      <Flex>
        <Box mr={2}>Hello, {data.me.username}!</Box>
        <Button isLoading={logoutFetching} onClick={() => logout()} variant='link'>
          logout
        </Button>
      </Flex>
    );
  }

  return (
    <Flex bg='tan' p={4}>
      <Box ml={'auto'}>{body}</Box>
    </Flex>
  );
};

export default NavBar;
