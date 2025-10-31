import { gql } from "@apollo/client";

export const ME_QUERY = gql`
  query MeProfile {
    me {
      id
      name
      email
      phone
      gender
    }
  }
`;

