import {
  Datagrid,
  Edit,
  List,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  useNotify,
  useRedirect,
} from "react-admin";
import { useMediaQuery } from "@material-ui/core";
import { useStyles } from "../styles";
import EditNoDeleteToolbar from "../components/EditNoDeleteToolbar";
import { useSession } from "next-auth/client";
import BackButton from "../components/BackButton";
import { useEffect, useState } from "react";
import { getSeperatedArraysWithUniqueValues } from "./location_data";

export const LocationList = (props) => {
  const [blocks, setBlocks] = useState(null);
  const [districts, setDistricts] = useState(null);
  const [clusters, setClusters] = useState(null);
  useEffect(() => {
    const { block, district, cluster } = getSeperatedArraysWithUniqueValues();
    setBlocks(block);
    setClusters(cluster);
    setDistricts(district);
  }, []);
  const postFilters = [
    <TextInput label="Search" source="id" alwaysOn />,
    <SelectInput label="District" source="district" choices={districts} />,
    <SelectInput label="Block" source="block" choices={blocks} />,
    <SelectInput label="Cluster" source="cluster" choices={clusters} />,
  ];
  const isSmall = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const classes = useStyles();
  return (
    <List
      {...props}
      bulkActionButtons={false}
      title="Schools list"
      className={isSmall ? classes.smList : classes.list}
      exporter={false}
      filters={postFilters}
    >
      <Datagrid rowClick={"edit"}>
        <TextField source="id" />
        <TextField source="district" />
        <TextField source="block" />
        <TextField source="cluster" />
      </Datagrid>
    </List>
  );
};

export const LocationEdit = (props) => {
  const classes = useStyles();
  const notify = useNotify();
  const redirect = useRedirect();
  const [session] = useSession();

  const getTemplateFromDeliveryStatus = (status) => {
    const obj = config.statusChoices.find((elem) => elem.id === status);
    return [obj?.template, obj?.templateId, obj?.variables];
  };

  const onSuccess = async ({ data }) => {
    if (data) {
      notify(
        "ra.notification.updated",
        "info",
        { smart_count: 1 },
        props.mutationMode === "undoable"
      );
      const { delivery_status } = data;
      const [template, templateId, variables] =
        getTemplateFromDeliveryStatus(delivery_status);
      if (template && variables && session.role) {
        //get each variable (which could be a path, like "ab.cd"), and replace it with
        //the appropriate value from the data object
        let replacedVariables = variables.map((keys) =>
          //turn "ef" or "ab.cd" into ["ef"] and ["ab", "cd"] respectively
          //and then reduce that to a singular value
          keys.split(".").reduce((acc, key) => acc[key], data)
        );

        const message = buildGupshup(template, replacedVariables);
        const response = await sendSMS(message, templateId, data.phone_number);
        if (response?.success) notify(response.success, "info");
        else if (response?.error) notify(response.error, "warning");
        redirect("list", props.basePath, data.id, data);
      }
    }
  };

  const Title = ({ record }) => {
    return (
      <span>
        Edit Location <span className={classes.grey}>#{record.udise}</span>
      </span>
    );
  };
  return (
    <Edit
      onSuccess={onSuccess}
      mutationMode={"pessimistic"}
      title={<Title />}
      {...props}
    >
      <SimpleForm toolbar={<EditNoDeleteToolbar />}>
        <BackButton history={props.history} />
        <span className={classes.heading}>Location Details</span>
        <div className={classes.grid}>
          <ReferenceInput source="id" reference="location">
            <SelectInput disabled optionText={"id"} />
          </ReferenceInput>
          <TextInput locales="en-IN" source="district" />
          <TextInput source="block" />
          <TextInput source="cluster" />
        </div>
      </SimpleForm>
    </Edit>
  );
};
