import { useQuery } from "react-query"
import loginQuery from "../../graphql/authentication/login.graphql"
import { graphQLClient, queryClient } from "../../pages/_app"

interface UserInfo {
  email: string
  password: string
}
export default function useLogin(userInfo: UserInfo) {
  return useQuery(
    "login",
    async () => {
      const { searchLatin: data } = await graphQLClient.request(
        loginQuery,
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
