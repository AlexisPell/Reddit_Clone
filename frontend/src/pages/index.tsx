import { withUrqlClient } from 'next-urql';
import NavBar from '../components/NavBar';
import { createUrqlClient } from '../utils/createUrqlClient';

import { usePostsQuery } from './../generated/graphql';

const Index = () => {
  const [{ data }] = usePostsQuery();
  return (
    <>
      <NavBar />
      <h1>Hello world!</h1>
      <br />
      {!data ? (
        <div>Loading...</div>
      ) : (
        data.posts.map((post) => <div key={post.id}>{post.title}</div>)
      )}
    </>
  );
};

export default withUrqlClient(createUrqlClient)(Index);
