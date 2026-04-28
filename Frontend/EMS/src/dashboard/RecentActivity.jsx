import React, { useEffect, useState } from "react";
import { FaUserPlus, FaCheckCircle, FaTasks, FaClock } from "react-icons/fa";
import api from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";

function RecentActivity() {

  const [activities, setActivities] = useState([]);

  const getToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");

  useEffect(() => {
    getActivities();
  }, []);

  const getActivities = async () => {
    try {

      const token = getToken();

      const res = await api.get(API_ENDPOINTS.dashboard, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Dashboard Response:", res.data);

      const activityData =
        res.data?.recentActivities ||
        res.data?.activities ||
        res.data?.data?.recentActivities ||
        [];

      setActivities(activityData.slice(0, 6));

    } catch (error) {

      console.error(
        "Error fetching activities:",
        error.response?.data || error.message
      );

      setActivities([]);

    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "employee":
        return <FaUserPlus />;
      case "leave":
        return <FaCheckCircle />;
      case "task":
        return <FaTasks />;
      default:
        return <FaClock />;
    }
  };

  const formatTime = (time) => {

    if (!time) return "";

    if (!isNaN(Date.parse(time))) {
      return new Date(time).toLocaleString();
    }

    return time;
  };

  return (
    <div className="activity">

      <h3>Recent Activity</h3>

      {activities.length === 0 ? (
        <p>No recent activities</p>
      ) : (
        <ul>

          {activities.map((activity, index) => {

            const message =
              activity.message ||
              activity.title ||
              activity.activity ||
              "Activity updated";

            const rawTime =
              activity.time ||
              activity.createdAt ||
              activity.date ||
              "";

            const type =
              activity.type ||
              activity.activityType ||
              "attendance";

            return (
              <li key={index}>

                <div className="activity-left">
                  <span className="activity-icon teal">
                    {getIcon(type)}
                  </span>
                  <strong>{message}</strong>
                </div>

                <span>{formatTime(rawTime)}</span>

              </li>
            );
          })}

        </ul>
      )}

    </div>
  );
}

export default RecentActivity;
