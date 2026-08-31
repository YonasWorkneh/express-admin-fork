"use client";

import { useState } from "react";
import { Search, Star, Gift, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import TablePagination from "@/components/common/TablePagination";
import { IoAdd, IoStar, IoArrowBack } from "react-icons/io5";
import { FaCrown } from "react-icons/fa";

interface CreditProgramMember {
  id: string;
  customerId: string;
  name: string;
  email: string;
  tier: string;
  points: number;
  totalEarned: number;
  totalRedeemed: number;
  joinDate: string;
  lastActivity: string;
  nextReward: number;
  status: string;
}

/** No credit-program endpoint exists yet — starts empty until the backend ships one. */
const creditProgramMembers: CreditProgramMember[] = [];

const tierBenefits = [
  {
    tier: "Bronze",
    minPoints: 0,
    maxPoints: 199,
    color: "bg-amber-100 text-amber-700",
    benefits: ["5% discount", "Free shipping"],
  },
  {
    tier: "Silver",
    minPoints: 200,
    maxPoints: 499,
    color: "bg-gray-100 text-gray-700",
    benefits: ["10% discount", "Priority support", "Free shipping"],
  },
  {
    tier: "Gold",
    minPoints: 500,
    maxPoints: 999,
    color: "bg-yellow-100 text-yellow-700",
    benefits: [
      "15% discount",
      "Priority support",
      "Free shipping",
      "Exclusive offers",
    ],
  },
  {
    tier: "Platinum",
    minPoints: 1000,
    maxPoints: 9999,
    color: "bg-purple-100 text-purple-700",
    benefits: [
      "20% discount",
      "VIP support",
      "Free shipping",
      "Exclusive offers",
      "Personal account manager",
    ],
  },
];

export default function LoyaltyProgram() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterTier, setFilterTier] = useState("all");

  const navigate = useNavigate();

  // Filter members by tier
  const filteredMembers = creditProgramMembers.filter((member) => {
    if (filterTier === "all") return true;
    return member.tier.toLowerCase() === filterTier.toLowerCase();
  });

  const metrics = [
    {
      title: "Total Members",
      value: creditProgramMembers.length,
      icon: <Star className="h-5 w-5" />,
      color: "blue",
    },
    {
      title: "Active Members",
      value: creditProgramMembers.filter((m) => m.status === "Active").length,
      icon: <Award className="h-5 w-5" />,
      color: "green",
    },
    {
      title: "Points Issued",
      value: creditProgramMembers.reduce((sum, m) => sum + m.totalEarned, 0),
      icon: <Gift className="h-5 w-5" />,
      color: "purple",
    },
    {
      title: "Points Redeemed",
      value: creditProgramMembers.reduce((sum, m) => sum + m.totalRedeemed, 0),
      icon: <FaCrown className="h-5 w-5" />,
      color: "orange",
    },
  ];

  // Calculate pagination
  const totalItems = filteredMembers.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const getTierColor = (tier: string) => {
    const tierInfo = tierBenefits.find((t) => t.tier === tier);
    return tierInfo?.color || "bg-gray-100 text-gray-700";
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "Bronze":
        return <IoStar className="h-4 w-4" />;
      case "Silver":
        return <IoStar className="h-4 w-4" />;
      case "Gold":
        return <IoStar className="h-4 w-4 text-yellow-500" />;
      case "Platinum":
        return <FaCrown className="h-4 w-4 text-purple-500" />;
      default:
        return <IoStar className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <main>
        <Card className="shadow-none border-none">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/customer")}
                    className="cursor-pointer bg-[#EE1E21] text-[#FADF4B] hover:bg-[#cc1a1c] hover:text-[#FADF4B] p-2"
                  >
                    <IoArrowBack className="h-5 w-5" />
                  </Button>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <IoStar className="text-[#EE1E21]" />
                    Credit Program
                  </h1>
                </div>
                <p className="text-gray-500 text-sm ml-11">
                  Manage customer credit points, tiers, and rewards
                </p>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                <Button
                  onClick={() => navigate("/customer/loyalty/create")}
                  className="bg-[#EE1E21] hover:bg-[#cc1a1c] cursor-pointer text-[#FADF4B]"
                >
                  <IoAdd className="mr-2 h-4 w-4" />
                  Add Coupon
                </Button>
                {/* <Button
                  onClick={() => navigate("/customer/loyalty/rewards")}
                  className="bg-purple-500 hover:bg-purple-600 cursor-pointer text-white"
                >
                  <IoGift className="mr-2 h-4 w-4" />
                  Manage Rewards
                </Button> */}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {metrics.map((metric, index) => (
                <Card key={index} className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">{metric.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {metric.value}
                        </p>
                      </div>
                      <div
                        className={`p-3 rounded-lg bg-${metric.color}-100 text-${metric.color}-600`}
                      >
                        {metric.icon}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative w-80">
                <Search className="absolute left-3 top-4 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search credit members..."
                  className="pl-10 pr-3 w-full py-6"
                />
              </div>
              <Select
                value={filterTier}
                onValueChange={(value) => setFilterTier(value)}
              >
                <SelectTrigger className="w-[180px] py-6">
                  <SelectValue placeholder="All Tiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">
                      <Checkbox />
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Member
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Tier
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Current Points
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Total Earned
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Total Redeemed
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Next Reward
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Last Activity
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Status
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMembers.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="text-center text-gray-500 py-8"
                      >
                        No credit program members yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {paginatedMembers.map((member, index) => (
                    <TableRow
                      key={index}
                      className="border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        navigate(`/customer/details/${member.customerId}`)
                      }
                    >
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <IoStar className="h-4 w-4 text-yellow-600" />
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">
                              {member.name}
                            </span>
                            <div className="text-sm text-gray-500">
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getTierColor(member.tier)}
                        >
                          {getTierIcon(member.tier)}
                          <span className="ml-1">{member.tier}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <IoStar className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium text-gray-900">
                            {member.points}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {member.totalEarned}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {member.totalRedeemed}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-900">
                          {member.nextReward} points
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(member.lastActivity).toLocaleDateString(
                          "en-GB",
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            member.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }
                        >
                          ● {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 px-3 text-[#EE1E21] bg-[#EE1E21]/5 hover:bg-[#EE1E21]/10 hover:text-[#cc1a1c] cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/customer/loyalty/edit/${member.id}`);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 px-3 text-green-600 bg-green-50 hover:bg-green-100 hover:text-green-700 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/customer/loyalty/points/${member.id}`);
                            }}
                          >
                            Points
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
