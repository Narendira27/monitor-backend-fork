import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { CheckCircle, XCircle, Clock, Cpu, MemoryStick } from "lucide-react";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import { toast, Toaster } from "sonner";
import useWindowSize from "react-use/lib/useWindowSize";

dayjs.extend(relativeTime);

const isHealthy = (dateStr) => {
  const now = dayjs();
  const timestamp = dayjs(dateStr);
  return now.diff(timestamp, "second") <= 25;
};

const StatusCard = ({ type, date }) => {
  const healthy = isHealthy(date);

  return (
    <motion.div
      initial={{ opacity: 0.8, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
      className={`p-4 rounded-xl shadow-md flex flex-col justify-center items-center gap-2 w-full transition-all ${
        healthy
          ? "bg-green-200 hover:bg-green-300 shadow-green-300"
          : "bg-red-200 hover:bg-red-300 shadow-red-300 animate-pulse"
      }`}
    >
      {healthy ? (
        <CheckCircle className="text-green-700 w-8 h-8" />
      ) : (
        <XCircle className="text-red-700 w-8 h-8" />
      )}
      <p className="font-medium text-center text-lg">{type}</p>
      <div className="flex items-center gap-1 text-sm text-center">
        <Clock className="w-4 h-4" />
        <span>{dayjs(date).fromNow()}</span>
      </div>
      <p className="text-xs text-gray-600">
        ({dayjs(date).format("HH:mm:ss")})
      </p>
    </motion.div>
  );
};

const AnimatedStat = ({ icon: Icon, label, value, unit }) => (
  <motion.div
    key={value}
    initial={{ scale: 0.9, opacity: 0.8 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.3 }}
    className="flex items-center gap-1"
  >
    <Icon className="w-4 h-4" />
    <span className="font-semibold">{label}:</span>
    <span>
      {value}
      {unit}
    </span>
  </motion.div>
);

const App = () => {
  const [data, setData] = useState([]);
  const [systemInfo, setSystemInfo] = useState({
    cpu: { total: 0 },
    mem: { percent: 0 },
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  const fetchData = async () => {
    try {
      const response = await axios.get(
        "https://api.tradedeck.narendira.in/user/servicesEvents"
      );
      setData(response.data);

      const hasUnhealthy = response.data.some((item) => !isHealthy(item.date));

      if (hasUnhealthy) {
        toast.error("⚠️ Some services are unhealthy!");
        setShowConfetti(false);
      } else {
        if (!showConfetti) {
          setShowConfetti(true);
          toast.success("🎉 All services are healthy!");
        }
      }
    } catch (err) {
      console.error("Failed to fetch service data:", err);
    }
  };

  const fetchSystemInfo = async () => {
    try {
      const response = await axios.get(
        "https://server-watch.narendira.in/api/4/all",
        {
          headers: {
            Authorization: "Basic YWRtaW46TkFSRU4yNw==",
          },
        }
      );
      setSystemInfo(response.data);
    } catch (err) {
      console.error("Failed to fetch system info:", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchSystemInfo();
    const interval = setInterval(() => {
      fetchData();
      fetchSystemInfo();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const groupByName = () => {
    const groups = {};
    data.forEach((item) => {
      if (!groups[item.name]) {
        groups[item.name] = [];
      }
      groups[item.name].push(item);
    });
    return groups;
  };

  const groupedData = groupByName();

  return (
    <div className="p-4 relative">
      {showConfetti && <Confetti width={width} height={height} />}
      <Toaster position="top-center" richColors />

      {/* Sticky Top Bar */}
      <div className="sticky rounded-3xl top-0 bg-white z-10 p-4 shadow-md mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Service Health Dashboard</h1>
        <div className="flex gap-4 text-sm">
          <AnimatedStat
            icon={Cpu}
            label="CPU"
            value={systemInfo.cpu.total}
            unit="%"
          />
          <AnimatedStat
            icon={MemoryStick}
            label="Memory"
            value={systemInfo.mem.percent}
            unit="%"
          />
        </div>
      </div>

      {Object.keys(groupedData).length === 0 ? (
        <p className="text-center text-gray-500">No service data available.</p>
      ) : (
        Object.keys(groupedData).map((serviceName) => (
          <div key={serviceName} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{serviceName}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {groupedData[serviceName].map((item, index) => (
                <StatusCard key={index} type={item.type} date={item.date} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default App;
