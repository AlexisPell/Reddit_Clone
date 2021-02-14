import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import { Box, Button, Flex, Link, Text } from '@chakra-ui/react';
import { Formik, Form } from 'formik';

import InputField from '../components/InputField';
import Layout from '../components/Layout';

import { useCreatePostMutation, useMeQuery } from '../generated/graphql';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../utils/createUrqlClient';
import { useIsAuth } from '../utils/useIsAuth';

interface NextProps {}

const createPost: NextPage<NextProps> = () => {
  const router = useRouter();
  useIsAuth();
  const [error, setError] = useState<string | null>(null);
  const [, createPost] = useCreatePostMutation();

  return (
    <Layout variant='small'>
      <Formik
        initialValues={{ title: '', text: '' }}
        onSubmit={async (values) => {
          const { error } = await createPost({ input: values });
          console.log('Error', error);
          if (error?.message.includes('Post must contain title and body')) {
            setError('Title and body may not be blank');
            setTimeout(() => {
              setError(null);
            }, 2500);
          } else if (!error) {
            router.push('/');
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <Box mb={3} textAlign='center'>
              Create post
            </Box>
            <InputField name='title' placeholder='title' label='Title' />
            <Box mt={4}>
              <InputField name='text' textarea placeholder='text...' label='Body' />
            </Box>
            {error && <Text>{error}</Text>}
            <Flex justifyContent='space-between'>
              <Button type='submit' mt={2} isLoading={isSubmitting} colorScheme='teal'>
                Create post
              </Button>
              <Link mt={4} onClick={() => router.push('/')}>
                Return to home page
              </Link>
            </Flex>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient)(createPost);
