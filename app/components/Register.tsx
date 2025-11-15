"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface User {
  id?: number;
  nic: string;
  contactNo: string;
  firstName: string;
  lastName: string;
  branch: string;
  isActive: boolean;
  financePrevilage: boolean;
  username: string;
  password?: string;
}

export default function Register() {
  const [formData, setFormData] = useState({
    nic: "",
    contactNo: "",
    firstName: "",
    lastName: "",
    branch: "",
    isActive: true,
    financePrevilage: false,
    username: "",
    password: "",
  });

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<{
    nic?: string;
    contactNo?: string;
  }>({});

  // Fetch all users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Validate NIC (Sri Lankan format: 9 digits with V/X or 12 digits with V/X)
  const validateNIC = (nic: string): string | null => {
    if (!nic) return null;
    // Old format: 9 digits with V or X at the end (e.g., 982760305V)
    // New format: 12 digits with V or X at the end (e.g., 123456789012V)
    const oldFormat = /^\d{9}[VXvx]$/;
    const newFormat = /^\d{12}[VXvx]$/;
    
    if (oldFormat.test(nic) || newFormat.test(nic)) {
      return null; // Valid
    }
    return "Invalid NIC format. Use 9 digits with V/X (old) or 12 digits with V/X (new)";
  };

  // Validate contact number (only numbers)
  const validateContact = (contact: string): string | null => {
    if (!contact) return null;
    // Only allow numbers
    if (!/^\d+$/.test(contact)) {
      return "Contact number must contain only numbers";
    }
    // Optional: Check length (e.g., 9-10 digits for Sri Lankan numbers)
    if (contact.length < 9 || contact.length > 10) {
      return "Contact number should be 9-10 digits";
    }
    return null;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Clear field error when user starts typing
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: undefined,
      });
    }

    // Validate NIC - only allow digits and V/X
    if (name === "nic") {
      // Convert to uppercase for consistency
      let nicValue = value.toUpperCase();
      
      // Only allow digits and V/X
      nicValue = nicValue.replace(/[^0-9VX]/g, "");
      
      // V/X can only be at the end, remove if in middle
      if (nicValue.length > 0) {
        const lastChar = nicValue[nicValue.length - 1];
        const hasVXInMiddle = /[VX]/.test(nicValue.slice(0, -1));
        
        if (hasVXInMiddle) {
          // Remove V/X from middle, keep only at end
          nicValue = nicValue.replace(/[VX]/g, "");
          if (lastChar === "V" || lastChar === "X") {
            nicValue += lastChar;
          }
        }
      }
      
      const error = validateNIC(nicValue);
      if (error) {
        setFieldErrors({
          ...fieldErrors,
          nic: error,
        });
      }
      
      setFormData({
        ...formData,
        [name]: nicValue,
      });
      return;
    }

    // Validate contact number - only allow numbers
    if (name === "contactNo") {
      // Only allow numbers
      const numericValue = value.replace(/\D/g, "");
      const error = validateContact(numericValue);
      if (error) {
        setFieldErrors({
          ...fieldErrors,
          contactNo: error,
        });
      }
      setFormData({
        ...formData,
        [name]: numericValue, // Store only numbers
      });
      return;
    }

    setFormData({
      ...formData,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "select-one"
          ? value
          : value,
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const handleSelectUser = async (userId: number) => {
    try {
      setErrorMessage(""); // Clear previous errors
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        const user = data.user;
        setFormData({
          nic: user.nic || "",
          contactNo: user.contactNo || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          branch: user.branch || "",
          isActive: user.isActive ?? true,
          financePrevilage: user.financePrevilage || false,
          username: user.username || "",
          password: "", // Don't load password
        });
        setSelectedUserId(userId); // Mark that a user is selected
        // Scroll to form
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        // Show error message in white color
        setErrorMessage(data.error || "Failed to load user data");
        setSelectedUserId(null);
      }
    } catch (error) {
      console.error("Error loading user:", error);
      setErrorMessage("An error occurred while loading user data");
      setSelectedUserId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      nic: "",
      contactNo: "",
      firstName: "",
      lastName: "",
      branch: "",
      isActive: true,
      financePrevilage: false,
      username: "",
      password: "",
    });
    setSelectedUserId(null);
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate fields before submission
    const nicError = validateNIC(formData.nic);
    const contactError = validateContact(formData.contactNo);
    
    if (nicError || contactError) {
      setFieldErrors({
        nic: nicError || undefined,
        contactNo: contactError || undefined,
      });
      alert("Please fix the validation errors before submitting");
      return;
    }

    setSubmitting(true);

    try {
      const url = selectedUserId
        ? `/api/users/${selectedUserId}`
        : "/api/users/register";
      const method = selectedUserId ? "PUT" : "POST";

      // Don't send password if updating (password is not editable)
      const submitData = selectedUserId
        ? {
            nic: formData.nic,
            contactNo: formData.contactNo,
            firstName: formData.firstName,
            lastName: formData.lastName,
            branch: formData.branch,
            isActive: formData.isActive,
            financePrevilage: formData.financePrevilage,
          }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        alert(
          selectedUserId
            ? "User updated successfully!"
            : "User registered successfully!"
        );
        // Reset form
        resetForm();
        // Refresh users list
        fetchUsers();
      } else {
        alert(
          data.error ||
            (selectedUserId ? "Update failed!" : "Registration failed!")
        );
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert(
        `An error occurred during ${selectedUserId ? "update" : "registration"}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Registration Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage user registrations and view all users</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Login
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Registration Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedUserId ? "View/Edit User" : "Register New User"}
              </h2>
              {selectedUserId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4">
                <p className="text-white bg-gray-800 px-4 py-2 rounded-lg text-sm font-medium">
                  {errorMessage}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* NIC */}
              <div>
                <label
                  htmlFor="nic"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  NIC <span className="text-red-500">*</span>
                </label>
                <input
                  id="nic"
                  name="nic"
                  type="text"
                  value={formData.nic}
                  onChange={handleChange}
                  required
                  maxLength={13}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400 ${
                    fieldErrors.nic
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter NIC (9 digits with V/X or 12 digits with V/X)"
                />
                {fieldErrors.nic && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.nic}</p>
                )}
              </div>

              {/* Contact No */}
              <div>
                <label
                  htmlFor="contactNo"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Contact No <span className="text-red-500">*</span>
                </label>
                <input
                  id="contactNo"
                  name="contactNo"
                  type="tel"
                  value={formData.contactNo}
                  onChange={handleChange}
                  required
                  maxLength={10}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400 ${
                    fieldErrors.contactNo
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter contact number (numbers only)"
                />
                {fieldErrors.contactNo && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.contactNo}
                  </p>
                )}
              </div>

              {/* First Name */}
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
                  placeholder="Enter first name"
                />
              </div>

              {/* Last Name */}
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Last Name <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
                  placeholder="Enter last name (optional)"
                />
              </div>

              {/* Branch */}
              <div>
                <label
                  htmlFor="branch"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Branch
                </label>
                <input
                  id="branch"
                  name="branch"
                  type="text"
                  value={formData.branch}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
                  placeholder="Enter branch"
                />
              </div>

              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  required={!selectedUserId}
                  readOnly={selectedUserId !== null}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400 ${
                    selectedUserId !== null
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  }`}
                  placeholder="Enter username"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password {selectedUserId && "(Not editable)"}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!selectedUserId}
                  readOnly={selectedUserId !== null}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400 ${
                    selectedUserId !== null
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  }`}
                  placeholder="Enter password"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={handleCheckboxChange}
                    className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                  />
                  <label
                    htmlFor="isActive"
                    className="ml-2 text-sm font-medium text-gray-700"
                  >
                    Active
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="financePrevilage"
                    name="financePrevilage"
                    type="checkbox"
                    checked={formData.financePrevilage}
                    onChange={handleCheckboxChange}
                    className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                  />
                  <label
                    htmlFor="financePrevilage"
                    className="ml-2 text-sm font-medium text-gray-700"
                  >
                    Finance Privilege
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-all ${
                  submitting
                    ? "bg-gray-900 text-white opacity-50 cursor-not-allowed"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
              >
                {submitting
                  ? selectedUserId
                    ? "Updating..."
                    : "Registering..."
                  : selectedUserId
                  ? "Update User"
                  : "Register User"}
              </button>
            </form>
          </div>

          {/* Right Side - Users Table */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">All Users</h2>
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {/* Filter Buttons */}
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  statusFilter === "all"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  statusFilter === "active"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter("inactive")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  statusFilter === "inactive"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Inactive
              </button>
            </div>

            {/* Filtered Users Count */}
            {(() => {
              const filteredUsers =
                statusFilter === "all"
                  ? users
                  : statusFilter === "active"
                  ? users.filter((u) => u.isActive)
                  : users.filter((u) => !u.isActive);

              return (
                <>
                  <div className="mb-4 text-sm text-gray-600">
                    Showing {filteredUsers.length} of {users.length} users
                  </div>

                  {loading ? (
                    <div className="text-center py-8 text-gray-500">
                      Loading users...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No {statusFilter === "all" ? "" : statusFilter} users found
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              User ID
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              NIC
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Contact
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Branch
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Username
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Finance
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredUsers.map((user, index) => (
                            <tr key={user.id || index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {user.id || "-"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    user.isActive
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {user.isActive ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {user.firstName} {user.lastName}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {user.nic}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {user.contactNo}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {user.branch}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {user.username}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    user.financePrevilage
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {user.financePrevilage ? "Yes" : "No"}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <button
                                  onClick={() => user.id && handleSelectUser(user.id)}
                                  disabled={!user.id}
                                  className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Select
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
