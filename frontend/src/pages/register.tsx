import { Box, Button, FormControl } from '@chakra-ui/react';
import { Form, Formik } from 'formik';
import { useMutation } from 'urql';
import InputField from '../components/InputField';
import Wrapper from '../components/Wrapper';

interface registerProps {}

const REISTER_MUT = `
mutation Register($username: String!, $password: String!) {
  register(options: { username: $username, password: $password}) {
    errors {
      field
      message
    }
    user {
      id
      createdAt
      updatedAt
      username
    }
  }
}`;

// 2:45

const Register: React.FC<registerProps> = ({}) => {
  const [, register] = useMutation(REISTER_MUT);
  return (
    <Wrapper variant='small'>
      <Formik
        initialValues={{ username: '', password: '' }}
        onSubmit={(values) => {
          return register(values);
        }}
      >
        {({ isSubmitting }) => (
          <Form
            style={{
              border: '0.5px solid #a3b7cd',
              borderRadius: '5px',
              padding: '15px 10px',
              height: '100%',
            }}
          >
            <Box textAlign='center'>Register form</Box>
            <FormControl>
              <InputField name='username' placeholder='username' label='Username' />
              <Box mt={4}>
                <InputField
                  name='password'
                  placeholder='password'
                  label='Password'
                  type='password'
                />
              </Box>
            </FormControl>
            <Button
              type='submit'
              size='small'
              p='1'
              mt={2}
              isLoading={isSubmitting}
              colorScheme='teal'
            >
              Register
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default Register;
