import { Box, Button, Flex, Heading, Link, Stack, Text } from '@chakra-ui/react';
import { withUrqlClient } from 'next-urql';
import NextLink from 'next/link';
import { useState } from 'react';
import Layout from '../components/Layout';
import { createUrqlClient } from '../utils/createUrqlClient';
import { usePostsQuery } from './../generated/graphql';

const Index = () => {
  const [variables, setVariables] = useState<{ limit: number; cursor: string | null }>({
    limit: 33,
    cursor: null,
  });
  const [{ data, fetching }] = usePostsQuery({ variables });

  console.log(variables);

  if (!fetching && !data) {
    return <div>Posts loading failed</div>;
  }

  return (
    <Layout>
      <Flex justifyContent='space-between'>
        <Heading>LiReddit</Heading>
        <NextLink href='/create-post'>
          <Link>create post</Link>
        </NextLink>
      </Flex>
      <Box mt={5}>
        {!data && fetching ? (
          <div>Loading...</div>
        ) : (
          <Stack spacing={8}>
            {data!.posts.posts.map((post) => (
              <Box key={post.id} p={5} shadow='md' borderWidth='1px'>
                <Heading fontSize='l'>{post.title}</Heading>
                <Text mt={4}>{post.textSnippet + ' ...'}</Text>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
      {data && data.posts.hasMore ? (
        <Flex>
          <Button
            onClick={() =>
              setVariables({
                limit: variables.limit,
                cursor: data.posts.posts[data.posts.posts.length - 1].createdAt,
              })
            }
            isLoading={fetching}
            my={4}
            mx='auto'
          >
            Load more posts
          </Button>
        </Flex>
      ) : null}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient)(Index);
