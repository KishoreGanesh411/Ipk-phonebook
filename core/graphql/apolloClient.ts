// core/graphql/apolloClient.ts
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { auth } from '@/core/firebase/firebaseConfig';

// Use your NestJS GraphQL endpoint reachable from devices on LAN
const GRAPHQL_ENDPOINT = 'http://192.168.0.113:3333/graphql';

const httpLink = new HttpLink({
  uri: GRAPHQL_ENDPOINT,
});

// Attach Firebase ID token so NestJS (FirebaseAuthGuard) can authenticate requests
const authLink = setContext(async (_, { headers }) => {
  try {
    const token = await auth.currentUser?.getIdToken?.();
    return {
      headers: {
        ...headers,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    };
  } catch {
    return { headers };
  }
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
