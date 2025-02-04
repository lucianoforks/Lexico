import { Grid } from "@material-ui/core"
import { makeStyles } from "@material-ui/core/styles"
import { useContext, useEffect } from "react"
import CardDeck from "../../components/accessories/CardDeck"
import { Context } from "../../components/layout/Context"
import SingleCardLayout from "../../components/layout/SingleCardLayout"
import LoginCard from "../../components/user/login/LoginCard"
import SettingsCard from "../../components/user/settings/SettingsCard"
import useSnackbarEnhanced from "../../hooks/useSnackbarEnhanced"
import { showSettingsInstructions } from "../../utils/localSettings"

export default function User() {
  const classes = useStyles()
  const { user } = useContext(Context)

  const { enqueueSnackbar } = useSnackbarEnhanced()
  useEffect(() => {
    if (!user && showSettingsInstructions()) {
      enqueueSnackbar(
        `Your settings are saved locally, sign in to save them across devices/browsers`,
        {
          autoHideDuration: 10000,
        },
      )
    }
  }, [])

  return !user ? (
    <Grid container justify="center" className={classes.noUser}>
      <CardDeck
        cards={[
          {
            key: "LoginCard",
            Card: () => <LoginCard />,
          },
          {
            key: "SettingsCard",
            Card: () => <SettingsCard />,
          },
        ]}
      />
    </Grid>
  ) : (
    <SingleCardLayout>
      <SettingsCard />
    </SingleCardLayout>
  )
}

const useStyles = makeStyles((theme: any) => ({
  noUser: {
    marginTop: theme.spacing(4),
  },
}))
