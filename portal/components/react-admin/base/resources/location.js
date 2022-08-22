import {
  Datagrid,
  Edit,
  List,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  useFilterState,
  useGetList,
  useGetMany,
  useInitializeFormWithRecord,
  useListContext,
  useListFilterContext,
  useNotify,
  useQuery,
  useRedirect,
} from "react-admin";
import { useMediaQuery } from "@material-ui/core";
import { useStyles } from "../styles";
import EditNoDeleteToolbar from "../components/EditNoDeleteToolbar";
import { useSession } from "next-auth/client";
import BackButton from "../components/BackButton";
import { useMemo, useState } from "react";
import * as _ from "lodash";

export const LocationList = (props) => {
  const params = new Proxy(new URLSearchParams(props.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  const initialFilters = params.filter ? JSON.parse(params.filter) : null;
  const [selectedDistrict, setSelectedDistrict] = useState(
    initialFilters?.district || ""
  );
  const [selectedBlock, setSelectedBlock] = useState(
    initialFilters?.block || ""
  );
  const [selectedCluster, setSelectedCluster] = useState(
    initialFilters?.cluster || ""
  );
  const {
    data: districtData,
    isLoading,
    error,
  } = useQuery(
    {
      type: "getList",
      resource: "location",
      payload: {},
    },
    {}
  );
  const districts = useMemo(() => {
    if (!districtData) {
      return [];
    }
    return _.uniqBy(districtData, "district").map((a) => {
      return {
        id: a.district,
        name: a.district,
      };
    });
  }, [districtData]);
  const blocks = useMemo(() => {
    if (!selectedDistrict || !districtData) {
      return [];
    }
    return _.uniqBy(
      districtData.filter((d) => d.district === selectedDistrict),
      "block"
    ).map((a) => {
      return {
        id: a.block,
        name: a.block,
      };
    });
  }, [selectedDistrict, districtData]);

  const clusters = useMemo(() => {
    if (!selectedBlock || !districtData) {
      return [];
    }
    return _.uniqBy(
      districtData.filter((d) => d.block === selectedBlock),
      "cluster"
    ).map((a) => {
      return {
        id: a.cluster,
        name: a.cluster,
      };
    });
  }, [selectedBlock, districtData]);

  const postFilters = [
    <TextInput label="Search" source="id" alwaysOn />,
    <SelectInput
      label="District"
      onChange={(e) => setSelectedDistrict(e.target.value)}
      value={selectedDistrict}
      source="district"
      choices={districts}
    />,
    selectedDistrict ? (
      <SelectInput
        label="Block"
        onChange={(e) => setSelectedBlock(e.target.value)}
        value={selectedBlock}
        source="block"
        choices={blocks}
      />
    ) : (
      <></>
    ),
    selectedBlock ? (
      <SelectInput
        label="Cluster"
        onChange={(e) => setSelectedCluster(e.target.value)}
        value={selectedCluster}
        source="cluster"
        choices={clusters}
      />
    ) : (
      <></>
    ),
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
