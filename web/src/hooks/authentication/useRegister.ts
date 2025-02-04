import { useQuery } from "react-query"
import registerMutation from "../../graphql/authentication/register.graphql"
import { graphQLClient, queryClient } from "../../pages/_app"

interface UserInfo {
  email: string
  password: string
}
export default function useRegister(userInfo: UserInfo) {
  return useQuery(
    "register",
    async () => {
      const { searchLatin: data } = await graphQLClient.request(
        registerMutation,
        userInfo,
      )
      return data
    },
    {
      enabled: false,
      retry: false,
      onSuccess: async () => {
        await queryClient.invalidateQueries("user")
      },
    },
  )
}
