import { ENV } from "@/config/env";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import { auth } from "@/core/firebase/firebaseConfig";

const httpLink = new HttpLink({ uri: ENV.GRAPHQL_URL });

const authLink = setContext(async (_, { headers }) => {
  const token = await auth.currentUser?.getIdToken?.();
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

export const apolloClient = new ApolloClient({
  link: onError((err) => {
    if (err.graphQLErrors || err.networkError) {
      // eslint-disable-next-line no-console
      console.warn("Apollo error:", {
        graphQLErrors: err.graphQLErrors,
        networkError: err.networkError,
      });
    }
  }).concat(authLink).concat(httpLink),
  cache: new InMemoryCache(),
});
