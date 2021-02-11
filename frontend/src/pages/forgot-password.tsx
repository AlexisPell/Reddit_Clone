import { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Box, Button } from '@chakra-ui/react';
import { Form, Formik } from 'formik';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../utils/createUrqlClient';

import InputField from '../components/InputField';
import Wrapper from '../components/Wrapper';

import { useForgotPasswordMutation } from '../generated/graphql';

interface NextProps {}

const forgotPassword: NextPage<NextProps> = () => {
  const router = useRouter();
  const [, forgotPassword] = useForgotPasswordMutation();
  const [complete, setComplete] = useState(false);

  return (
    <Wrapper variant='small'>
      <Formik
        initialValues={{ email: '' }}
        onSubmit={async (values, { setErrors }) => {
          await forgotPassword(values);
          setComplete(true);
        }}
      >
        {({ isSubmitting }) =>
          complete ? (
            <Box>If an account with this email exists, we sent you a message</Box>
          ) : (
            <Form>
              <Box textAlign='center'>Recover password using your mail</Box>
              <Box mt={4}>
                <InputField name='email' placeholder='Email' label='Email' />
              </Box>
              <Button type='submit' mt={4} isLoading={isSubmitting} colorScheme='teal'>
                Reestablish password
              </Button>
            </Form>
          )
        }
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(forgotPassword);
