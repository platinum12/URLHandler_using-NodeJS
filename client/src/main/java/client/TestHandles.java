package client;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class TestHandles {
	List<String> handles;

	public List<String> getHandles() {
		return handles;
	}

	public void setHandles(List<String> handles) {
		this.handles = handles;
	}

	@Override
	public String toString() {
		return "TestHandles [handles=" + handles + "]";
	}
}
