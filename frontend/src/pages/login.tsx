import { useRouter } from 'next/router';
import { Box, Button, FormControl } from '@chakra-ui/react';
import { Form, Formik } from 'formik';

import { useLoginMutation } from '../generated/graphql';

import InputField from '../components/InputField';
import Wrapper from '../components/Wrapper';

import { toErrorMap } from '../utils/toErrorMap';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../utils/createUrqlClient';

interface loginProps {}

const Login: React.FC<loginProps> = () => {
  const router = useRouter();
  const [, login] = useLoginMutation();

  return (
    <Wrapper variant='small'>
      <Formik
        initialValues={{ usernameOrEmail: '', password: '' }}
        onSubmit={async (values, { setErrors }) => {
          const response = await login(values);
          if (response.data?.login.errors) {
            setErrors(toErrorMap(response.data.login.errors));
          } else if (response.data?.login.user) {
            // worked
            router.push('/');
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <Box textAlign='center'>Login form</Box>
            <FormControl>
              <InputField
                name='usernameOrEmail'
                placeholder='username or email'
                label='Username or Email'
              />
              <Box mt={4}>
                <InputField
                  name='password'
                  placeholder='password'
                  label='Password'
                  type='password'
                />
              </Box>
            </FormControl>
            <Button type='submit' mt={2} isLoading={isSubmitting} colorScheme='teal'>
              Login
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(Login);
