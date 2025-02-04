import { Grid, Switch, Typography } from "@material-ui/core"
import React from "react"

interface Props {
  field: string
  label: string
  formik: any
}
export default function SettingsSwitch({ field, label, formik }: Props) {
  return (
    <Grid container justify="space-between" alignItems="center">
      <Typography>{label}:</Typography>
      <Switch
        id={field}
        name={field}
        color="primary"
        value={formik.values[field]}
        checked={formik.values[field]}
        onChange={formik.handleChange}
      />
    </Grid>
  )
}
