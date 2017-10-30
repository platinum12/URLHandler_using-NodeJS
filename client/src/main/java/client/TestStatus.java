package client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Model class to hold test status.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class TestStatus {
	private String testHandle;
	private String status;
	public String getTestHandle() {
		return testHandle;
	}
	public void setTestHandle(String testHandle) {
		this.testHandle = testHandle;
	}
	public String getStatus() {
		return status;
	}
	public void setStatus(String status) {
		this.status = status;
	}
	@Override
	public String toString() {
		return "TestStatus [testHandle=" + testHandle + ", status=" + status + "]";
	}
}
