import {
  BooleanField,
  BooleanInput,
  Datagrid,
  DateField,
  DateInput,
  Edit,
  List,
  NumberField,
  NumberInput,
  ReferenceField,
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

export const StudentList = (props) => {
  const isSmall = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const classes = useStyles();
  return (
    <List
      {...props}
      bulkActionButtons={false}
      title="Schools list"
      className={isSmall ? classes.smList : classes.list}
      exporter={false}
    >
      <Datagrid rowClick="edit">
        <NumberField source="admission_number" />
        <TextField source="category" />
        <DateField source="created" />
        <TextField source="father_name" />
        <TextField source="gender" />
        <NumberField source="grade_number" />
        <TextField source="grade_year_mapping" />
        <TextField source="id" />
        <BooleanField source="is_cwsn" />
        <BooleanField source="is_enabled" />
        <TextField source="mother_name" />
        <TextField source="name" />
        <NumberField source="phone" />
        <DateField source="previous_acad_year" />
        <NumberField source="previous_grade" />
        <TextField source="id" />
        <TextField source="section" />
        <TextField source="stream_tag" />
        <DateField source="updated" />
      </Datagrid>
    </List>
  );
};

export const StudentEdit = (props) => {
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
        let replacedVariables = variables.map(
          (
            keys //turn "ef" or "ab.cd" into ["ef"] and ["ab", "cd"] respectively
          ) =>
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
          <NumberInput source="admission_number" />
          <TextInput source="category" />
          <DateInput source="created" />
          <TextInput source="father_name" />
          <TextInput source="gender" />
          <NumberInput source="grade_number" />
          <TextInput source="grade_year_mapping" />
          <TextInput source="id" />
          <BooleanInput source="is_cwsn" />
          <BooleanInput source="is_enabled" />
          <TextInput source="mother_name" />
          <TextInput source="name" />
          <NumberInput source="phone" />
          <DateInput source="previous_acad_year" />
          <NumberInput source="previous_grade" />
          <SelectInput optionText="id" />
          <TextInput source="section" />
          <TextInput source="stream_tag" />
          <DateInput source="updated" />
        </div>
      </SimpleForm>
    </Edit>
  );
};
