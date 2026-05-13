import { useEffect, useState } from "react";
import AdminLogin from "./AdminLogin";

export default function Admin() {

  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [rejected, setRejected] = useState([]);

  const API = import.meta.env.VITE_BACKEND_URL;

  const [loggedIn, setLoggedIn] =
    useState(false);

  useEffect(() => {

    const token =
      localStorage.getItem("adminToken");

    if (token) {
      setLoggedIn(true);
    }

  }, []);

  if (!loggedIn) {
    return (
      <AdminLogin
        onLogin={() => setLoggedIn(true)}
      />
    );
  }

  return (
    <div>

      <h1>Admin Dashboard</h1>

    </div>
  );
}


  // FETCH ALL
  const fetchData = async () => {

    try {

      const pendingRes =
        await fetch(
          `${API}/api/v1/confessions/pending`
        );

      const approvedRes =
        await fetch(
          `${API}/api/v1/confessions/approved/recent`
        );

      const rejectedRes =
        await fetch(
          `${API}/api/v1/confessions/rejected/recent`
        );

      const pendingData =
        await pendingRes.json();

      const approvedData =
        await approvedRes.json();

      const rejectedData =
        await rejectedRes.json();

      setPending(pendingData.data || []);
      setApproved(approvedData.data || []);
      setRejected(rejectedData.data || []);

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    },5000); 
    return () => clearInterval(interval);
  }, []);

  // APPROVE
  const approveConfession =
    async (id, caption) => {

      await fetch(
        `${API}/api/v1/confessions/${id}/approve`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            caption
          })
        }
      );

      fetchData();
    };

  // REJECT
  const rejectConfession =
    async (id) => {

      await fetch(
        `${API}/api/v1/confessions/${id}/reject`,
        {
          method: "PATCH"
        }
      );

      fetchData();
    };

  // CARD UI
  const renderCards = (
    list,
    showButtons = false
  ) => {

    return list.map((confession) => (

      <div
        key={confession._id}
        style={{
          border: "1px solid gray",
          padding: 20,
          marginBottom: 20,
          borderRadius: 10
        }}
      >

        <h3>
          To: {confession.to}
        </h3>

        <p>
          {confession.message}
        </p>

        {
          confession.imageUrls?.map(
            (url, index) => (

              <img
                key={index}
                src={url}
                alt=""
                width="250"
                style={{
                  display: "block",
                  marginBottom: 10
                }}
              />
            )
          )
        }

        {
          showButtons && (

            <>
              <textarea
                placeholder="Optional caption"
                id={`caption-${confession._id}`}
                style={{
                  width: "100%",
                  height: 80
                }}
              />

              <br />
              <br />

              <button
                onClick={() => {

                  const caption =
                    document.getElementById(
                      `caption-${confession._id}`
                    ).value;

                  approveConfession(
                    confession._id,
                    caption
                  );
                }}
              >
                Approve
              </button>

              <button
                onClick={() =>
                  rejectConfession(
                    confession._id
                  )
                }
                style={{
                  marginLeft: 10
                }}
              >
                Reject
              </button>
            </>
          )
        }

      </div>
    ));
  };

  return (

    <div style={{ padding: 20 }}>

      <h1>
        Admin Panel
      </h1>

      {/* PENDING */}

      <h2>
        Pending Confessions
      </h2>

      {renderCards(pending, true)}

      <hr />

      {/* APPROVED */}

      <h2>
        Recently Approved
      </h2>

      {renderCards(approved)}

      <hr />

      {/* REJECTED */}

      <h2>
        Recently Rejected
      </h2>

      {renderCards(rejected)}

    </div>
  );