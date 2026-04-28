import React from "react";
import "./Dashboard.css";

import TopCharts from "./TopCharts";
import RecentActivity from "./RecentActivity";
import Holidays from "./Holidays";
import QuickActions from "./QuickActions";

function Dashboard() {
  return (
    <div className="dashboard">
      <h2 className="title">Dashboard</h2>
      <p className="subtitle">
        Welcome back! Here’s an overview of your organization.
      </p>

      <TopCharts />

      <div className="bottom">
        <RecentActivity />

        <div className="right">
          <Holidays />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
