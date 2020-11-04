import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { get } from 'object-path';
import {
  searchGranules,
  clearGranulesSearch,
  filterGranules,
  clearGranulesFilter,
  listGranules,
  getOptionsCollectionName,
  listWorkflows,
  applyWorkflowToGranule,
  getCount,
} from '../../actions';
import { lastUpdated, tally, displayCase } from '../../utils/format';
import {
  tableColumns,
  errorTableColumns,
  bulkActions,
  defaultWorkflowMeta,
  executeDialog,
} from '../../utils/table-config/granules';
import List from '../Table/Table';
import LogViewer from '../Logs/viewer';
import Dropdown from '../DropDown/dropdown';
import Search from '../Search/search';
import statusOptions from '../../utils/status';
import { strings } from '../locale';
import { workflowOptionNames } from '../../selectors';
import Breadcrumbs from '../Breadcrumbs/Breadcrumbs';
import ListFilters from '../ListActions/ListFilters';

const AllGranules = ({
  collections,
  dispatch,
  granules,
  location,
  logs,
  queryParams,
  workflowOptions,
  stats,
}) => {
  const [workflow, setWorkflow] = useState(workflowOptions[0]);
  const [workflowMeta, setWorkflowMeta] = useState(defaultWorkflowMeta);
  const { dropdowns } = collections;
  const { list } = granules;
  const { count, queriedAt } = list.meta;
  const logsQuery = { granuleId__exists: 'true' };
  const query = generateQuery();
  const view = getView();
  const displayCaseView = displayCase(view);
  const statusOpts = view === 'all' ? statusOptions : null;
  const tablesortId = view === 'failed' ? 'granuleId' : 'timestamp';
  const errorCount = get(stats, 'count.data.granules.count') || [];
  const breadcrumbConfig = [
    {
      label: 'Dashboard Home',
      href: '/',
    },
    {
      label: 'Granules',
      href: '/granules',
    },
    {
      label: displayCaseView,
      active: true,
    },
  ];

  useEffect(() => {
    dispatch(listWorkflows());
  }, [dispatch]);

  useEffect(() => {
    setWorkflow(workflowOptions[0]);
  }, [workflowOptions]);

  useEffect(() => {
    dispatch(
      getCount({
        type: 'granules',
        field: 'error.Error.keyword',
        sidebarCount: false
      })
    );
  }, [dispatch]);

  function getView() {
    const { pathname } = location;
    if (pathname === '/granules/completed') return 'completed';
    if (pathname === '/granules/processing') return 'running';
    if (pathname === '/granules/failed') return 'failed';
    return 'all';
  }

  function generateQuery() {
    const options = { ...queryParams };
    const currentView = getView();
    if (currentView !== 'all') options.status = currentView;
    options.status = currentView;
    return options;
  }

  function generateBulkActions() {
    const config = {
      execute: {
        options: getExecuteOptions(),
        action: applyWorkflow,
      },
    };
    return bulkActions(granules, config);
  }

  function selectWorkflow(selector, selectedWorkflow) {
    setWorkflow(selectedWorkflow);
  }

  function applyWorkflow(granuleId) {
    const { meta } = JSON.parse(workflowMeta);
    setWorkflowMeta(defaultWorkflowMeta);
    return applyWorkflowToGranule(granuleId, workflow, meta);
  }

  function getExecuteOptions() {
    return [
      executeDialog({
        selectHandler: selectWorkflow,
        label: 'workflow',
        value: workflow,
        options: workflowOptions,
        initialMeta: workflowMeta,
        metaHandler: setWorkflowMeta,
      }),
    ];
  }

  function getGranuleErrorTypes() {
    const errorTypes = [];

    errorCount.map((e) => errorTypes.push(e.key));

    return errorTypes.map((e) => ({
      id: e,
      label: e,
    }));
  }

  return (
    <div className="page__component">
      <section className="page__section">
        <section className="page__section page__section__controls">
          <Breadcrumbs config={breadcrumbConfig} />
        </section>
        <div className="page__section__header page__section__header-wrapper">
          <h1 className="heading--large heading--shared-content with-description ">
            {displayCaseView} {strings.granules}{' '}
            <span className="num-title">
              {!Number.isNaN(+count) ? `${tally(count)}` : 0}
            </span>
          </h1>
          {lastUpdated(queriedAt)}
        </div>
      </section>
      <section className="page__section">
        <List
          list={list}
          action={listGranules}
          tableColumns={view === 'failed' ? errorTableColumns : tableColumns}
          query={query}
          bulkActions={generateBulkActions()}
          rowId="granuleId"
          sortId={tablesortId}
          filterAction={filterGranules}
          filterClear={clearGranulesFilter}
        >
          <ListFilters>
            <Dropdown
              getOptions={getOptionsCollectionName}
              options={get(dropdowns, ['collectionName', 'options']) || []}
              action={filterGranules}
              clear={clearGranulesFilter}
              paramKey="collectionId"
              label="Collection"
              inputProps={{
                placeholder: 'All',
              }}
            />
            {statusOpts && (
              <Dropdown
                options={statusOpts}
                action={filterGranules}
                clear={clearGranulesFilter}
                paramKey="status"
                label="Status"
                inputProps={{
                  placeholder: 'All',
                }}
              />
            )}
            <Search
              action={searchGranules}
              clear={clearGranulesSearch}
              inputProps={{
                className: 'search search--large',
              }}
              label="Search"
              labelKey="granuleId"
              placeholder="Granule ID"
              searchKey="granules"
            />
            {view === 'failed' && (
              <Dropdown
                options={getGranuleErrorTypes()}
                action={filterGranules}
                clear={clearGranulesFilter}
                paramKey='error.Error'
                label={strings.error_type}
                inputProps={{
                  placeholder: 'All'
                }}
              />
            )}
          </ListFilters>
        </List>
      </section>
      <LogViewer
        query={logsQuery}
        dispatch={dispatch}
        logs={logs}
        notFound="No recent logs for granules"
      />
    </div>
  );
};

AllGranules.propTypes = {
  collections: PropTypes.object,
  dispatch: PropTypes.func,
  granules: PropTypes.object,
  location: PropTypes.object,
  logs: PropTypes.object,
  queryParams: PropTypes.object,
  workflowOptions: PropTypes.array,
  stats: PropTypes.object,
};

AllGranules.displayName = strings.all_granules;

export { AllGranules };

export default withRouter(
  connect((state) => ({
    collections: state.collections,
    granules: state.granules,
    logs: state.logs,
    stats: state.stats,
    workflowOptions: workflowOptionNames(state),
  }))(AllGranules)
);
