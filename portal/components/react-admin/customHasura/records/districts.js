import gql from "graphql-tag";

// Define the additional fields that we want.
export const GET_DISTRICTS = gql`
    query {
        location (distinct_on:[district]){
            id
            district
        }
    }
`;
