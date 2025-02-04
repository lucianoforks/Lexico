import {
  Box,
  CardActionArea,
  CardHeader as CardHeaderMui,
  Collapse,
  Grid,
  Link,
} from "@material-ui/core"
import { makeStyles } from "@material-ui/core/styles"
import Image from "next/image"
import React, { useState } from "react"
import tools from "../../../../utils/tools"
import ExpandIcon from "../accessories/ExpandIcon"

export default function ToolIconGrid() {
  const classes = useStyles()
  const [expanded, setExpanded] = useState<boolean>(false)

  return (
    <>
      <CardActionArea
        onClick={() => setExpanded((expanded) => !expanded)}
        disableRipple
        disableTouchRipple
        classes={{ focusHighlight: classes.hide }}
      >
        <CardHeaderMui
          title="Frameworks, Libraries, and Tools"
          titleTypographyProps={{ variant: "body1" }}
          className={classes.dropdown}
          action={
            <Box style={{ paddingTop: 8, paddingRight: 8 }}>
              <ExpandIcon {...{ expanded }} />
            </Box>
          }
        />
      </CardActionArea>
      <Collapse in={expanded}>
        <Grid
          container
          spacing={1}
          justify="center"
          className={classes.toolGrid}
        >
          {tools.map((tool) => (
            <Grid
              item
              xs={2}
              key={tool.name}
              className={classes.tool}
              container
              justify="center"
            >
              <Link
                href={tool.url}
                target="_blank"
                onClick={(e: any) => e.stopPropagation()}
              >
                <Image
                  src={`/icon/tool/${tool.name}.png`}
                  alt={tool.name}
                  width={128}
                  height={128}
                  priority
                  loading="eager"
                />
              </Link>
            </Grid>
          ))}
        </Grid>
      </Collapse>
    </>
  )
}

const useStyles = makeStyles((theme: any) => ({
  dropdown: {
    paddingTop: 0,
    paddingBottom: 0,
    padding: theme.spacing(1),
  },
  toolGrid: {
    padding: theme.spacing(1),
  },
  tool: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  hide: {
    display: "none",
  },
}))
