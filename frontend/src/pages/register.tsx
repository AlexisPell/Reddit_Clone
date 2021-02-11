import { useRouter } from 'next/router';
import { Box, Button, FormControl } from '@chakra-ui/react';
import { Form, Formik } from 'formik';

import { useRegisterMutation } from '../generated/graphql';

import InputField from '../components/InputField';
import Wrapper from '../components/Wrapper';

import { toErrorMap } from '../utils/toErrorMap';
import { createUrqlClient } from '../utils/createUrqlClient';
import { withUrqlClient } from 'next-urql';
import { isServer } from '../utils/isServer';

interface registerProps {}

const Register: React.FC<registerProps> = ({}) => {
  const router = useRouter();
  const [, register] = useRegisterMutation();

  return (
    <Wrapper variant='small'>
      <Formik
        initialValues={{ username: '', password: '', email: '' }}
        onSubmit={async (values, { setErrors }) => {
          const response = await register({
            options: { username: values.username, password: values.password, email: values.email },
          });
          console.log('response on register', response);
          if (response.data?.register?.errors) {
            setErrors(toErrorMap(response.data.register.errors));
          } else if (!response.data?.register?.errors) {
            // worked
            router.push('/');
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <Box textAlign='center'>Register form</Box>
            <FormControl>
              <InputField name='username' placeholder='username' label='Username' />
              <Box mt={4}>
                <InputField name='email' placeholder='email' label='Email' />
              </Box>
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
              Register
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(Register);
