import gql from "graphql-tag";

// Define the additional fields that we want.
export const GET_DISTRICTS = gql`
  query {
    location(distinct_on: [district]) {
      id
      district
    }
  }
`;

export const GET_STUDENTS = gql`
  query MyQuery {
    student(limit: 10) {
      category
      school {
        udise
        name
      }
      father_name
      gender
      grade_number
      id
      is_cwsn
      is_enabled
      mother_name
      name
      phone
      roll
      stream_tag
      school_id
    }
    student_aggregate {
      aggregate {
        count
      }
    }
  }
`;
