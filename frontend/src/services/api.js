const API_BASE_URL = "http://localhost:5050/api";

export async function loginUser(credentials) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(credentials)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed.");
  }

  return data;
}

export async function createEmployee(employee) {
  const response = await fetch(`${API_BASE_URL}/employees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(employee)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Employee save failed.");
  }

  return data;
}

export async function getEmployees() {
  const response = await fetch(`${API_BASE_URL}/employees`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Employee list failed.");
  }

  return data.employees;
}

export async function getEmployeeByCode(employeeNo) {
  const response = await fetch(`${API_BASE_URL}/employees/code/${encodeURIComponent(employeeNo)}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Employee lookup failed.");
  }

  return data.employee;
}

export async function updateEmployee(id, employee) {
  const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(employee)
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Employee update failed.");
  }

  return data;
}

export async function deleteEmployee(id) {
  const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
    method: "DELETE"
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Employee delete failed.");
  }

  return data;
}

export async function getEmployeeAllowances(employeeId) {
  const response = await fetch(`${API_BASE_URL}/allowances/${employeeId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Allowance list failed.");
  }

  return data.allowances;
}

export async function saveEmployeeAllowances(employeeId, allowances) {
  const response = await fetch(`${API_BASE_URL}/allowances/${employeeId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ allowances })
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Allowance save failed.");
  }

  return data;
}
