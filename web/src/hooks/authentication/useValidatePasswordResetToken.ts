import { useQuery } from "react-query"
import validatePasswordResetTokenQuery from "../../graphql/authentication/validatePasswordResetToken.graphql"
import { graphQLClient } from "../../pages/_app"

export default function useValidatePasswordResetToken(
  passwordResetToken: string,
) {
  return useQuery(
    ["validatePasswordResetToken", passwordResetToken],
    async () => {
      const { validatePasswordResetToken: data } = await graphQLClient.request(
        validatePasswordResetTokenQuery,
        {
          passwordResetToken,
        },
      )
      return data
    },
  )
}
