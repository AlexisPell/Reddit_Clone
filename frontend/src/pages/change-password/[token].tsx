import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';

import { toErrorMap } from '../../utils/toErrorMap';
import { Box, FormControl, Button } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import InputField from '../../components/InputField';
import Wrapper from '../../components/Wrapper';
import { useChangePasswordMutation } from '../../generated/graphql';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../../utils/createUrqlClient';

interface NextProps {
  token: string;
}

const ChangePassword: NextPage<NextProps & any> = ({ token }) => {
  const router = useRouter();
  const [, changePassword] = useChangePasswordMutation();
  const [tokenError, setTokenError] = useState('');

  return (
    <Wrapper variant='small'>
      <Formik
        initialValues={{ newPassword: '' }}
        onSubmit={async (values, { setErrors }) => {
          const response = await changePassword({ newPassword: values.newPassword, token });

          if (response.data?.changePassword.errors) {
            const errorMap = toErrorMap(response.data.changePassword.errors);
            if ('token' in errorMap) {
              setTokenError(errorMap.token);
            }
            setErrors(errorMap);
          } else if (response.data?.changePassword.user) {
            // worked
            router.push('/');
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <Box textAlign='center'>Change password form</Box>
            <FormControl>
              <Box mt={4}>
                <InputField
                  name='newPassword'
                  placeholder='new password'
                  label='Password'
                  type='password'
                />
              </Box>
              {tokenError && (
                <Box mr={2} style={{ color: 'red' }}>
                  {tokenError}
                </Box>
              )}
            </FormControl>
            <Button type='submit' mt={2} isLoading={isSubmitting} colorScheme='teal'>
              Change password
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

ChangePassword.getInitialProps = (ctx) => {
  console.log('query', ctx);
  return {
    token: ctx.query.token as string,
  };
};

export default withUrqlClient(createUrqlClient)(ChangePassword);
